// deno-lint-ignore-file

const upload = async () => {
    const f = file.files[0];
    if (!f) return;

    const modal = document.createElement('div');
    modal.className = 'modal fade show d-block';
    modal.style.backgroundColor = 'rgba(0,0,0,.5)';
    modal.innerHTML = `
    <div class="modal-dialog modal-sm">
      <div class="modal-content text-center p-3">
        <div class="spinner-border text-primary mb-2" role="status"></div>
        <div>Uploading...</div>
      </div>
    </div>`;
    document.body.appendChild(modal);

    const body = new FormData();
    body.append('file', f);

    await fetch('/api/upload', { method: 'POST', body })
        .then(r => r.text())
        .then(msg => {
            modal.remove();   
            alert(msg);       
            location.reload();
        })
        .catch(() => {
            modal.remove();
            alert('Upload failed');
        });
};

const delFile = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;

    const res = await fetch(`/api/files/${encodeURIComponent(filename)}`, {
        method: "DELETE"
    });

    alert(await res.text()); 
    location.reload()          
}