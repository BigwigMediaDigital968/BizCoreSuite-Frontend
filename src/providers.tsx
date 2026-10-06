import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/services/queryClient";
import { Toaster } from "react-hot-toast"

type Props = {
  children: React.ReactNode;
};

export default function Providers({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={8}
        toasterId="default"
        toastOptions={{
          // Default styling for all standard toasts matching your surface theme
          className: 'font-body-md text-xs font-medium shadow-xl rounded-2xl border border-outline-variant/30 text-on-surface bg-surface-container-lowest backdrop-blur-md',
          duration: 4000,
          removeDelay: 500,
          style: {
            padding: '12px 16px',
          },

          // Success Toast Styling
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#059669', // Emerald primary matching system checkmarks
              secondary: '#ffffff',
            },
          },

          // Error Toast Styling
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#dc2626', // Error token color
              secondary: '#ffffff',
            },
          },
        }}
      />
      {children}
    </QueryClientProvider>
  );
}