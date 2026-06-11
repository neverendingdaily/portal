import InputForm from "@/components/InputForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-3">
            韓ドラ・ペルソナ
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            SNS投稿から深層心理を分析し、<br />
            13話の韓ドラ風ストーリーとセールスコピーを自動生成します。
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <InputForm />
        </div>
      </div>
    </main>
  );
}
