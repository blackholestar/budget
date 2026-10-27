import { Wizard } from "./wizard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center px-6 py-16">
        <h1 className="mb-10 text-2xl font-semibold tracking-tight">
          Daily Budget
        </h1>
        <Wizard />
      </main>
    </div>
  );
}
