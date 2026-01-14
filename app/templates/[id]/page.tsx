import { TemplateEditor } from '@/components/TemplateEditor';
import { mockTemplates } from '@/data/mockTemplates';

export function generateMetadata({ params }: { params: { id: string } }) {
  const template = mockTemplates.find((t) => t.id === params.id);
  // const post = await getPost(params.id);
  
  if (!template) {
    return {
      title: 'Meme || MemeVerse',
       description:
      // post.title?.slice(0, 160) ||
      "Watch this viral meme on Memeverse",
    };
  }

  return {
    title: `Create ${template.name} - MemeVerse`,
    description: template.description,
  };
}

export default function Page() {
  return <TemplateEditor />;
}
