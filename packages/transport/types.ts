import { Message } from "@/types";

export interface ITransport {
  send(data: string): void;
  onMessage(cb: (data: string) => void): void;
  destroy(): void;
}
