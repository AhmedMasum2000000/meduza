export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center animate-fade-in">
      <div className="panel card-reactive max-w-md p-10 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-fog">
          <span className="text-2xl">✨</span>
        </div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-muted">Coming Soon</p>
        <p className="mt-2 text-sm text-muted">
          This section is under development and will be available in a future update.
        </p>
      </div>
    </div>
  );
}
