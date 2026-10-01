'use client';

interface Props {
  password: string;
}

interface Rule {
  label: string;
  test: (p: string) => boolean;
}

const rules: Rule[] = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'Contains a number', test: (p) => /[0-9]/.test(p) },
  { label: 'Contains a symbol', test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

export function PasswordStrength({ password }: Props) {
  if (!password) return null;
  return (
    <ul className="mt-1 space-y-1">
      {rules.map((r) => {
        const ok = r.test(password);
        return (
          <li key={r.label} className="flex items-center gap-1.5 text-xs">
            <span
              className={ok ? 'text-[#10B981]' : 'text-[#6B7280]'}
              aria-hidden="true"
            >
              {ok ? '✓' : '○'}
            </span>
            <span className={ok ? 'text-[#10B981]' : 'text-[#6B7280]'}>
              {r.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
