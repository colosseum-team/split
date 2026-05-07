import crypto from "node:crypto";

function canonicalize(value: unknown): string {
  if (typeof value === "bigint") return JSON.stringify(value.toString());
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const parts = keys
    .filter((k) => obj[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`);
  return `{${parts.join(",")}}`;
}

export interface NormalizedContract {
  title: string;
  description: string;
  amount: string;
  currency: string;
  deadline: string;
  customerAddress: string;
  assigneeAddress: string;
}

export interface ContractHashInput {
  title: string;
  description: string;
  amount: bigint | number;
  currency: string;
  deadline: Date | null;
  customerAddress: string;
  assigneeAddress: string | null;
}

export function normalizeContract(input: ContractHashInput): NormalizedContract {
  return {
    title: input.title,
    description: input.description,
    amount: input.amount.toString(),
    currency: input.currency,
    deadline: input.deadline ? input.deadline.toISOString() : "",
    customerAddress: input.customerAddress,
    assigneeAddress: input.assigneeAddress ?? "",
  };
}

export function sha256Hex(value: unknown): string {
  return crypto
    .createHash("sha256")
    .update(canonicalize(value))
    .digest("hex");
}
