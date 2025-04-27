document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedNovels();
});

async function loadFeaturedNovels() {
    try {
        const response = await fetch('/novels');
        const novels = await response.json();
        displayNovels(novels);
    } catch (error) {
        console.error('Error loading novels:', error);
    }
}

function displayNovels(novels) {
    const novelsGrid = document.getElementById('featuredNovels');
    if (!novelsGrid) return;

    novelsGrid.innerHTML = novels.map(novel => `
        <div class="novel-card">
            <img src="${novel.coverImage}" alt="${novel.title}">
            <div class="novel-card-content">
                <h3>${novel.title}</h3>
                <p>${novel.description}</p>
                <a href="/novel.html?id=${novel.id}" class="read-more">Ler mais</a>
            </div>
        </div>
    `).join('');
} 