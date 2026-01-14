import { Message } from "../types";

// Note: In a real app with Vite/Convex, you'd use the ConvexClient here.
// For this setup, we'll maintain the structure for modularity.

export class ConvexAPI {
    async listMessages(): Promise<Message[]> {
        // Mocking the call for now as the actual Convex client requires setup
        console.log("Fetching messages from Convex...");
        return [];
    }

    async sendMessage(body: string): Promise<void> {
        console.log("Sending message to Convex:", body);
    }
}

export const api = new ConvexAPI();
