export default function LoadingScreen({ message = "Loading supplier workspace..." }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app-surface">
      <div className="flex flex-col items-center gap-4">
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-app-accent border-t-transparent" />
        <p className="text-sm font-medium text-slate-600">{message}</p>
      </div>
    </div>
  );
}
