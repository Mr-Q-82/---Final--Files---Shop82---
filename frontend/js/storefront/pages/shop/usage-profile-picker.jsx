function UsageProfilePicker({ profiles, value, onChange }) {
  if (!profiles?.length) return null;
  return (
    <section className="usage-profile-section glass">
      <div className="usage-profile-heading"><div><b>بر اساس نوع استفاده</b><small>محصول مناسب کاربری خود را سریع‌تر پیدا کنید</small></div><button type="button" onClick={() => { setUsageInLocation(""); onChange(""); }}>نمایش همه</button></div>
      <div className="usage-profile-grid">
        {profiles.map((profile) => {
          const UsageIcon = I[profile.icon] || I.cpu;
          const nextValue = value === profile.id ? "" : profile.id;
          const url = new URL(location.href);
          nextValue ? url.searchParams.set("usage", nextValue) : url.searchParams.delete("usage");
          return <a href={`${url.pathname}${url.search}`} key={profile.id} className={value === profile.id ? "active" : ""} aria-current={value === profile.id ? "true" : undefined} onClick={(event) => { event.preventDefault(); setUsageInLocation(nextValue); onChange(nextValue); }}>
            <span><UsageIcon className="icon" /></span><b>{profile.name}</b><small>{profile.description || "مشاهده محصولات پیشنهادی"}</small>
          </a>;
        })}
      </div>
    </section>
  );
}
