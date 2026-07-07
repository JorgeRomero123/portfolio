export const metadata = {
  title: 'MyAlbumLink Embed Test',
  description: 'Local test page for the MyAlbumLink iframe embed',
  robots: { index: false, follow: false },
};

export default function MyAlbumLinkEmbedTestPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        MyAlbumLink Embed Test
      </h1>
      <p className="text-gray-600 mb-8">
        Responsive 4:3 gallery embed from{' '}
        <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded">
          myalbumlink.com
        </code>
        .
      </p>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        {/* Responsive Gallery Embed (4:3) */}
        <div
          style={{
            position: 'relative',
            paddingBottom: '75%',
            height: 0,
            overflow: 'hidden',
            maxWidth: '100%',
          }}
        >
          <iframe
            src="https://myalbumlink.com/albums/usando-myalbumlink?embed=true"
            title="Usando MyAlbumLink"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0,
            }}
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
