// Search functionality
const searchInput = document.getElementById('searchInput');
const galleryGrid = document.getElementById('galleryGrid');

const sortCycleButton = document.getElementById('sortCycleButton');
const toggleSortOrderButton = document.getElementById('toggleSortOrderButton');

if (searchInput && galleryGrid) {
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    let currentItems = [...galleryItems];
    let sortTypes = ['size', 'name', 'date'];
    let currentSortIndex = 0;
    let isAscending = true;

    const sortFunctions = {
        size: (items) => {
            return items.sort((a, b) => {
                const sizeA = parseInt(a.dataset.size || 0);
                const sizeB = parseInt(b.dataset.size || 0);
                return isAscending ? sizeA - sizeB : sizeB - sizeA;
            });
        },
        name: (items) => {
            return items.sort((a, b) => {
                const titleA = a.dataset.title.toLowerCase();
                const titleB = b.dataset.title.toLowerCase();
                return isAscending
                    ? titleA.localeCompare(titleB)
                    : titleB.localeCompare(titleA);
            });
        },
        date: (items) => {
            return items.sort((a, b) => {
                const dateA = new Date(a.querySelector('.gallery-date').textContent.trim());
                const dateB = new Date(b.querySelector('.gallery-date').textContent.trim());
                return isAscending ? dateA - dateB : dateB - dateA;
            });
        },
    };

    const updateGallery = () => {
        const searchTerm = searchInput.value.toLowerCase();
        
        currentItems = galleryItems.filter(item => {
            const title = item.dataset.title;
            return title.includes(searchTerm);
        });

        const sortedItems = sortFunctions[sortTypes[currentSortIndex]](currentItems);

        galleryGrid.innerHTML = '';
        sortedItems.forEach(item => galleryGrid.appendChild(item));

        const noResults = document.querySelector('.no-results');
        if (sortedItems.length === 0 && !noResults) {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results';
            noResultsDiv.textContent = 'No matching items found';
            galleryGrid.appendChild(noResultsDiv);
        } else if (sortedItems.length > 0 && noResults) {
            noResults.remove();
        }

        sortCycleButton.querySelector('span').textContent = `Sort: ${sortTypes[currentSortIndex].charAt(0).toUpperCase() + sortTypes[currentSortIndex].slice(1)}`;
        toggleSortOrderButton.querySelector('span').textContent = isAscending ? 'Ascending' : 'Descending';
    };

    searchInput.addEventListener('input', updateGallery);

    sortCycleButton.addEventListener('click', () => {
        currentSortIndex = (currentSortIndex + 1) % sortTypes.length;
        updateGallery();
    });

    toggleSortOrderButton.addEventListener('click', () => {
        isAscending = !isAscending;
        updateGallery();
    });
}


document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('.gallery-image[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.src; // Trigger load
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        images.forEach(img => imageObserver.observe(img));
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const galleryItems = document.querySelectorAll('.gallery-item, .image-card');
    
    galleryItems.forEach(item => {
        const img = item.querySelector('.gallery-image');
        
        if (img) {
            img.addEventListener('load', function() {
                item.classList.add('loaded');
            });
        }
    });
});



document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.getElementById('backButton');
    const searchContainer = document.getElementById('searchContainer');
    const titleContainer = document.getElementById('titleContainer');
    const previewButtons = document.querySelectorAll('.gallery-button-container');

    if (previewButtons.length === 0) {
        if (backButton) {
            backButton.style.visibility = 'hidden';
            backButton.style.opacity = '0';
        }

        if (titleContainer) {
            titleContainer.style.visibility = 'hidden';
            titleContainer.style.opacity = '0';
        }
    } else {
        if (searchContainer) {
            searchContainer.style.visibility = 'hidden';
            searchContainer.style.opacity = '0';
        }
    }
});

