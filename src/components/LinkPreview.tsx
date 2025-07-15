interface LinkPreviewProps {
  content: string;
}

export function LinkPreview({ content }: LinkPreviewProps) {
  // Helper: Extract all links from content
  function extractLinks(text: string): string[] {
    const urlRegex = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/g;
    return text.match(urlRegex) || [];
  }

  // Helper: Render preview for a given link
  function renderLinkPreview(link: string) {
    // YouTube
    const ytMatch = link.match(/(?:https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/))([\w-]{11})/);
    if (ytMatch) {
      const id = ytMatch[1];
      return (
        <div key={link} className="w-full aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 my-2">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${id}`}
            title="YouTube video preview"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      );
    }
    // Instagram
    if (/instagram\.com\//.test(link)) {
      return (
        <div key={link} className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 my-2">
          <iframe
            src={`https://www.instagram.com/p/${link.split('/p/')[1]?.split('/')[0]}/embed`}
            width="100%"
            height="480"
            frameBorder="0"
            scrolling="no"
            allowTransparency={true}
            allow="encrypted-media"
            className="w-full h-[480px]"
            title="Instagram preview"
          ></iframe>
        </div>
      );
    }
    // Twitter (X)
    if (/twitter\.com\//.test(link)) {
      return (
        <div key={link} className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 my-2">
          <blockquote className="twitter-tweet">
            <a href={link}>{link}</a>
          </blockquote>
        </div>
      );
    }
    // Facebook
    if (/facebook\.com\//.test(link)) {
      return (
        <div key={link} className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 my-2">
          <iframe
            src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(link)}&show_text=true&width=500`}
            width="100%"
            height="480"
            style={{ border: 'none', overflow: 'hidden' }}
            scrolling="no"
            frameBorder="0"
            allowFullScreen={true}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            className="w-full h-[480px]"
            title="Facebook preview"
          ></iframe>
        </div>
      );
    }
    // Google Drive
    if (/drive\.google\.com\//.test(link)) {
      // Try to extract file id
      let fileId = '';
      const fileMatch = link.match(/\/d\/([\w-]+)/);
      if (fileMatch) fileId = fileMatch[1];
      else {
        const idParam = link.match(/[?&]id=([\w-]+)/);
        if (idParam) fileId = idParam[1];
      }
      if (fileId) {
        return (
          <div key={link} className="w-full aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 my-2">
            <iframe
              src={`https://drive.google.com/file/d/${fileId}/preview`}
              width="100%"
              height="100%"
              allow="autoplay"
              className="w-full h-full"
              title="Google Drive preview"
            ></iframe>
          </div>
        );
      }
    }
    // LinkedIn (show as link card)
    if (/linkedin\.com\//.test(link)) {
      return (
        <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition my-2">
          <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1">LinkedIn Post</div>
          <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{link}</div>
        </a>
      );
    }
    // Generic website (show as link card)
    return (
      <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition my-2">
        <div className="font-semibold text-gray-900 dark:text-white mb-1">Website Link</div>
        <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{link}</div>
      </a>
    );
  }

  const links = extractLinks(content);
  if (links.length === 0) return null;
  return <div>{links.map((link) => renderLinkPreview(link))}</div>;
} 