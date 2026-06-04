import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-neutral-page">
      <div className="relative hidden lg:block h-full w-full">
        <Image
          src="/auth-side.png"
          alt="OctoSight Login"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex flex-col justify-center h-full">
        {children}
      </div>
    </div>
  );
}
