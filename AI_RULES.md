# 🤖 AI Rules for Catálogo Virtual Pro

This document outlines the core technologies used in this project and provides clear guidelines on when and how to use specific libraries and tools.

## 🚀 Tech Stack Overview

*   **Frontend Framework**: React 18 with TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **UI Component Library**: shadcn/ui (built on Radix UI)
*   **Routing**: React Router DOM
*   **Data Fetching & State Management (Server State)**: TanStack Query
*   **Global State Management (Client State)**: Zustand (primarily for the shopping cart)
*   **Icons**: Lucide React
*   **Toast Notifications**: Sonner
*   **Backend as a Service (BaaS)**: Supabase (PostgreSQL, Authentication, Edge Functions, Realtime, Storage, Row Level Security)
*   **Serverless Functions**: Supabase Edge Functions (Deno)
*   **Transactional Emails**: Resend (used by Supabase Edge Functions)
*   **WhatsApp Integration**: Direct deep links to WhatsApp API (for quotes)

## 📚 Library Usage Rules

To maintain consistency, performance, and best practices, please adhere to the following guidelines:

1.  **React & TypeScript**: Always use React for building UI components and TypeScript for all application logic to ensure type safety and maintainability.
2.  **Tailwind CSS**: All styling must be done using Tailwind CSS utility classes. Avoid custom CSS files or inline styles unless absolutely necessary for dynamic, computed styles.
3.  **shadcn/ui**: Utilize shadcn/ui components for common UI elements (buttons, cards, forms, dialogs, etc.).
    *   **Do NOT modify shadcn/ui source files directly.** If a component needs customization beyond its props, create a new component that wraps or extends the shadcn/ui component.
4.  **React Router DOM**: Manage all client-side navigation and routing using `react-router-dom`. Keep main routes defined in `src/App.tsx`.
5.  **TanStack Query**: Use `useQuery` and `useMutation` from `@tanstack/react-query` for all data fetching, caching, and server-state management (e.g., fetching products, submitting forms to Supabase).
6.  **Zustand**: Reserve Zustand (`src/hooks/useCart.ts`) for managing global client-side state that is not directly tied to server data, such as the shopping cart state.
7.  **Sonner**: Implement all toast notifications using the `sonner` library for a consistent user feedback experience.
8.  **Lucide React**: Use icons from `lucide-react` for all visual iconography.
9.  **Supabase Client (`@supabase/supabase-js`)**: Interact with Supabase services (Auth, Database, Storage) exclusively through the `supabase` client instance defined in `src/integrations/supabase/client.ts`.
10. **Supabase Edge Functions**: For any backend logic, API endpoints, or server-side operations (e.g., analytics logging, product cloning, admin actions), create and use Supabase Edge Functions. Do not implement complex backend logic directly in the frontend.
11. **Resend**: This service is integrated at the Edge Function level for sending transactional emails (e.g., password resets, welcome emails). Frontend code should trigger the relevant Edge Function, not directly interact with Resend.
12. **WhatsApp Integration**: For initiating WhatsApp chats (e.g., sending quotes), use direct deep links (`https://wa.me/`). The message content should be URL-encoded.
13. **File Structure**:
    *   Components: `src/components/`
    *   Pages: `src/pages/`
    *   Hooks: `src/hooks/`
    *   Utilities: `src/lib/utils.ts`
    *   Supabase Integration: `src/integrations/supabase/`
    *   All directory names must be lowercase.