import RichTextEditor from "@/components/RichTextEditor";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-3xl font-semibold text-gray-800">Text Editor</h1>
        <p className="text-gray-600">
          A simple rich text editor with formatting options.
        </p>
        <RichTextEditor />
      </div>
    </main>
  );
}
