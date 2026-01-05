import Link from "next/link";
import { Camera, FolderOpen, FileText, Shield } from "lucide-react";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Camera className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              工程写真管理
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              ログイン
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              新規登録
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            建設現場の写真管理を
            <br />
            <span className="text-blue-600">シンプルに、確実に</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            工事写真の撮影から電子納品まで、一貫したワークフローで管理。
            黒板合成、アルバム作成、帳票出力をスムーズに。
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-lg hover:bg-blue-700"
            >
              無料で始める
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              ログイン
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Camera className="h-8 w-8" />}
            title="写真管理"
            description="ドラッグ&ドロップで簡単アップロード。EXIF情報を自動抽出。"
          />
          <FeatureCard
            icon={<FolderOpen className="h-8 w-8" />}
            title="工種分類"
            description="国土交通省基準の工種・種別・細別で整理。"
          />
          <FeatureCard
            icon={<FileText className="h-8 w-8" />}
            title="帳票出力"
            description="PDF/Excel形式でアルバム・台帳を出力。"
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="電子納品"
            description="JACIC基準準拠の電子成果品を作成。"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 text-blue-600">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}
