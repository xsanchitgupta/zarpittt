import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ServiceDetailLoading() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 'calc(var(--navbar-h) + 32px)', paddingBottom: 80, minHeight: '100vh' }}>
        <div className="container">
          {/* Breadcrumb Skeleton */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            <div className="skeleton" style={{ width: 60, height: 16 }} />
            <div className="skeleton" style={{ width: 100, height: 16 }} />
            <div className="skeleton" style={{ width: 140, height: 16 }} />
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
            .amazon-layout { display: grid; grid-template-columns: 350px 1fr 350px; gap: 40px; align-items: start; }
            .amazon-gallery { position: sticky; top: calc(var(--navbar-h) + 32px); align-self: start; }
            .amazon-buybox { position: sticky; top: calc(var(--navbar-h) + 32px); align-self: start; }
            @media (max-width: 1280px) {
              .amazon-layout { grid-template-columns: 300px 1fr 300px; gap: 24px; }
            }
            @media (max-width: 1024px) {
              .amazon-layout { grid-template-columns: 1fr 350px; }
              .amazon-gallery { grid-column: 1 / -1; display: flex; gap: 20px; position: relative; top: 0; }
              .amazon-gallery-main { flex: 1; }
              .amazon-gallery-thumbs { flex-direction: column; width: 100px; }
            }
            @media (max-width: 768px) {
              .amazon-layout { grid-template-columns: 1fr; gap: 24px; }
              .amazon-gallery { flex-direction: column; }
              .amazon-gallery-thumbs { flex-direction: row; width: 100%; }
              .amazon-buybox { position: relative; top: 0; }
            }
            `
          }} />

          <div className="amazon-layout">
            {/* Column 1: Image Gallery Skeleton */}
            <div className="amazon-gallery">
              <div className="skeleton amazon-gallery-main" style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-2xl)', marginBottom: 14 }} />
              <div className="amazon-gallery-thumbs" style={{ display: 'flex', gap: 10 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ flex: 1, aspectRatio: '4/3', borderRadius: 'var(--radius-lg)' }} />
                ))}
              </div>
            </div>

            {/* Column 2: Details & Info Skeleton */}
            <div>
              <div className="skeleton" style={{ width: '80%', height: 40, marginBottom: 14 }} />
              <div className="skeleton" style={{ width: '50%', height: 32, marginBottom: 24, borderRadius: 'var(--radius-full)' }} />

              <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                <div className="skeleton" style={{ width: '100%', height: 16, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '90%', height: 16, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '95%', height: 16, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 16 }} />
              </div>

              {/* Inclusion/Exclusion Skeleton */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 'var(--radius-xl)' }} />
                <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 'var(--radius-xl)' }} />
              </div>
            </div>

            {/* Column 3: Buy Box Skeleton */}
            <div className="amazon-buybox">
              <div style={{ padding: 28, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)' }}>
                <div className="skeleton" style={{ width: 100, height: 14, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: 140, height: 36, marginBottom: 24 }} />
                
                <div className="skeleton" style={{ width: '100%', height: 1, marginBottom: 24 }} />
                
                <div className="skeleton" style={{ width: '100%', height: 50, marginBottom: 12, borderRadius: 'var(--radius-xl)' }} />
                <div className="skeleton" style={{ width: '100%', height: 50, marginBottom: 24, borderRadius: 'var(--radius-xl)' }} />
                
                <div className="skeleton" style={{ width: '100%', height: 56, borderRadius: 'var(--radius-xl)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
