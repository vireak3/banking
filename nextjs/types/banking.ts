export type ApiEnvelope<T> = {
  status: "success" | "error";
  data: T;
  message: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
  updated_at?: string;
};

export type AuthSession = {
  user: User;
  token: string;
};

export type Account = {
  id: number;
  userId: number;
  balance: number;
  createdAt?: string;
  updatedAt?: string;
};

export type TransferPayload = {
  fromAccount: number;
  toAccount: number;
  amount: number;
};

export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";

export type Transaction = {
  id: number;
  fromAccount: number;
  toAccount: number;
  amount: number;
  status: TransactionStatus;
  blockchainHash: string;
  createdAt?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role?: string;
};

export type BlockchainVerification = {
  valid: boolean;
  message: string;
};

export type ToastTone = "success" | "error" | "info";