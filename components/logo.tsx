import Image from "next/image";

export default function Logo() {
  return (
    <>
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-md" />
        <Image
          src="/icon.png" 
          width={32}
          height={32} 
          alt="coredash logo" 
          unoptimized
          className="relative rounded-full border border-slate-100 shadow-sm"
        />
      </div>

      <div className="flex items-baseline">
        <span className="text-cyan-600">core</span>
        <span className="text-slate-900">dash</span>
      </div>
    </>
  );
}