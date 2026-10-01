import { FilterQuery, PipelineStage } from "mongoose";
import { route } from "@/lib/server/handler";
import { ok, paginate, listResult } from "@/lib/server/http";
import { Property, IProperty, PropertyStatus } from "@/lib/server/models/Property";
import { Investment } from "@/lib/server/models/Investment";
import { User } from "@/lib/server/models/User";
import { ApiError } from "@/lib/server/errors";
import { getSettings } from "@/lib/server/services/settings.service";
import { serializeProperty } from "@/lib/server/services/property.service";
import { createPropertySchema, CreatePropertyInput } from "@/lib/validators/property";

export const GET = route(
  {
    auth: false,
    optionalAuth: true,
  },
  async ({ user, query }) => {
    const { page, limit, skip } = paginate(query);
    const filter: FilterQuery<IProperty> = {};

    // Role-based visibility
    const isAdmin = user && user.role === "ADMIN";

    if (!isAdmin) {
      if (query.status && ["HOLDING", "SOLD", "LIVE", "FUNDED"].includes(query.status)) {
        filter.status = query.status;
      } else {
        filter.status = { $in: ["LIVE", "FUNDED"] };
      }
    } else if (query.status) {
      filter.status = query.status;
    }

    if (query.city) {
      filter.city = { $regex: new RegExp(`^${query.city}$`, "i") };
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.minPrice || query.maxPrice) {
      filter.unitPrice = {};
      if (query.minPrice) {
        filter.unitPrice.$gte = parseInt(query.minPrice, 10);
      }
      if (query.maxPrice) {
        filter.unitPrice.$lte = parseInt(query.maxPrice, 10);
      }
    }

    if (query.minFunding !== undefined || query.maxFunding !== undefined) {
      const minF = query.minFunding !== undefined ? parseFloat(query.minFunding) : 0;
      const maxF = query.maxFunding !== undefined ? parseFloat(query.maxFunding) : 100;
      const exprConditions: Record<string, unknown>[] = [];

      if (query.minFunding !== undefined) {
        exprConditions.push({
          $gte: [
            {
              $multiply: [
                {
                  $divide: [
                    "$unitsSold",
                    { $cond: [{ $gt: ["$totalUnits", 0] }, "$totalUnits", 1] },
                  ],
                },
                100,
              ],
            },
            minF,
          ],
        });
      }

      if (query.maxFunding !== undefined) {
        exprConditions.push({
          $lte: [
            {
              $multiply: [
                {
                  $divide: [
                    "$unitsSold",
                    { $cond: [{ $gt: ["$totalUnits", 0] }, "$totalUnits", 1] },
                  ],
                },
                100,
              ],
            },
            maxF,
          ],
        });
      }

      if (exprConditions.length > 0) {
        filter.$expr = (exprConditions.length === 1 ? exprConditions[0] : { $and: exprConditions }) as any;
      }
    }

    if (query.search) {
      const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { city: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    // Sort mapping
    const isFundingSort = query.sort === "-fundingPct" || query.sort === "fundingPct";
    const fundingSortDir: 1 | -1 = query.sort === "fundingPct" ? 1 : -1;

    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort && !isFundingSort) {
      switch (query.sort) {
        case "unitPrice":
        case "price":
          sortOptions = { unitPrice: 1 };
          break;
        case "-unitPrice":
        case "-price":
          sortOptions = { unitPrice: -1 };
          break;
        case "createdAt":
          sortOptions = { createdAt: 1 };
          break;
        case "-createdAt":
          sortOptions = { createdAt: -1 };
          break;
      }
    }

    let rawItems: IProperty[];
    let total: number;

    if (isFundingSort) {
      const pipeline: PipelineStage[] = [
        { $match: filter },
        {
          $addFields: {
            fundingRatio: {
              $divide: ["$unitsSold", { $cond: [{ $gt: ["$totalUnits", 0] }, "$totalUnits", 1] }],
            },
          },
        },
        { $sort: { fundingRatio: fundingSortDir, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ];

      [rawItems, total] = await Promise.all([
        Property.aggregate(pipeline).exec(),
        Property.countDocuments(filter),
      ]);
    } else {
      [rawItems, total] = await Promise.all([
        Property.find(filter).sort(sortOptions).skip(skip).limit(limit),
        Property.countDocuments(filter),
      ]);
    }

    // Batch enrich with broker names and investor counts
    const brokerIds = [...new Set(rawItems.map((p) => p.brokerId.toString()))];
    const brokers = await User.find({ _id: { $in: brokerIds } }).select("name");
    const brokerMap = new Map(brokers.map((b) => [b._id.toString(), b.name]));

    const serialized = await Promise.all(
      rawItems.map(async (item) => {
        const distinctInvestors = await Investment.distinct("investorId", {
          propertyId: item._id,
          status: "ACTIVE",
        });
        return serializeProperty(item, {
          investorCount: distinctInvestors.length,
          brokerName: brokerMap.get(item.brokerId.toString()),
        });
      })
    );

    return ok(listResult(serialized, total, page, limit));
  }
);

export const POST = route<CreatePropertyInput>(
  {
    auth: true,
    roles: ["ADMIN", "BROKER"],
    schema: createPropertySchema,
  },
  async ({ user, body }) => {
    if (user!.role === "BROKER" && !user!.brokerApproved) {
      throw new ApiError(
        403,
        "BROKER_NOT_APPROVED",
        "Your broker account is awaiting approval from administrators"
      );
    }

    const { valuation, totalUnits, minUnits } = body;

    if (valuation % totalUnits !== 0) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Valuation must be evenly divisible by totalUnits"
      );
    }

    const unitPrice = valuation / totalUnits;
    if (unitPrice % 100 !== 0) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Price per unit must be a whole rupee (divisible by 100 paise)"
      );
    }

    if (minUnits > totalUnits) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Minimum units cannot exceed totalUnits"
      );
    }

    const settings = await getSettings();
    const maxUnitsPerInvestor =
      body.maxUnitsPerInvestor ||
      Math.floor((totalUnits * settings.maxOwnershipPct) / 100);

    const property = await Property.create({
      ...body,
      unitPrice,
      maxUnitsPerInvestor,
      unitsSold: 0,
      status: "DRAFT",
      brokerId: user!._id,
    });

    const serialized = await serializeProperty(property, {
      investorCount: 0,
      brokerName: user!.name,
    });

    return ok(serialized, "Property listing draft created successfully", 201);
  }
);
