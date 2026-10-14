import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ServicesLoading() {
  return (
    <>
      <Navbar />
      <div style={{minHeight:'100vh',paddingTop:'calc(var(--navbar-h) + 60px)'}}>
        <div className="container">
          <div style={{marginBottom:32}}>
            <div className="skeleton" style={{width:200,height:40,marginBottom:8}} />
            <div className="skeleton" style={{width:350,height:20}} />
          </div>
          <div className="page-layout-services">
            <aside className="filter-sidebar">
              <div style={{padding:24,background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)'}}>
                <div className="skeleton" style={{width:80,height:16,marginBottom:18}} />
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:12}}>
                      <div className="skeleton" style={{width:20,height:20,borderRadius:6}} />
                      <div className="skeleton" style={{width:120,height:16}} />
                    </div>
                  ))}
                </div>
              </div>
            </aside>
            <div className="services-content">
              <div className="services-grid">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 380 }}>
                    <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 0 }} />
                    <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div className="skeleton" style={{ width: '40%', height: 14, marginBottom: 12 }} />
                      <div className="skeleton" style={{ width: '80%', height: 20, marginBottom: 12 }} />
                      <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 16 }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <div className="skeleton" style={{ width: '30%', height: 24 }} />
                        <div className="skeleton" style={{ width: '20%', height: 32, borderRadius: 999 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
