// Tapintu - Frontend Application
// Hive Posts Display with commentrewarder beneficiary

class TapintuApp {
    constructor() {
        this.postsContainer = document.getElementById('posts-container');
        this.loadingIndicator = document.getElementById('loading');
        this.emptyState = document.getElementById('empty-state');
        
        this.initEventListeners();
        this.loadFeed();
    }

    initEventListeners() {
        document.getElementById('refresh-feed').addEventListener('click', () => {
            this.loadFeed();
        });

        document.getElementById('dark-mode-toggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // Initialize dark mode from localStorage
        this.initDarkMode();
    }

    initDarkMode() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.documentElement.classList.add('dark');
            document.getElementById('dark-mode-icon').className = 'fas fa-sun';
            this.updateLogo(true);
        }
    }

    toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', isDark);
        const icon = document.getElementById('dark-mode-icon');
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        this.updateLogo(isDark);
    }

    updateLogo(isDark) {
        const logo = document.getElementById('logo-image');
        if (logo) {
            logo.src = isDark ? '/assets/tapintu-dark.png' : '/assets/tapintu.png';
        }
    }

    showLoading() {
        this.loadingIndicator.classList.remove('hidden');
        this.emptyState.classList.add('hidden');
        this.postsContainer.innerHTML = '';
    }

    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
    }

    async loadFeed() {
        try {
            this.showLoading();
            this.eventSource = new EventSource('/api/feed');
            
            this.eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.done) {
                    this.eventSource.close();
                    this.hideLoading();
                    console.log('Feed streaming complete');
                } else if (data.post) {
                    // Add post to feed as it arrives
                    this.addPostToFeed(data.post);
                }
            };
            
            this.eventSource.onerror = (error) => {
                console.error('Feed stream error:', error);
                this.eventSource.close();
                this.hideLoading();
                this.showError('Failed to load feed. Please try again.');
            };
        } catch (error) {
            console.error('Error loading feed:', error);
            this.showError('Failed to load feed. Please try again.');
            this.hideLoading();
        }
    }
    
    addPostToFeed(post) {
        // Initialize empty state on first post
        if (this.postsContainer.innerHTML === '') {
            this.emptyState.classList.add('hidden');
            this.hideLoading();
        }
        
        const postCard = this.createPostCard(post);
        this.postsContainer.appendChild(postCard);
    }

    displayPosts(posts) {
        this.postsContainer.innerHTML = '';
        
        if (!Array.isArray(posts) || posts.length === 0) {
            this.emptyState.classList.remove('hidden');
            return;
        }

        this.emptyState.classList.add('hidden');

        posts.forEach(post => {
            const postCard = this.createPostCard(post);
            this.postsContainer.appendChild(postCard);
        });
    }

    createPostCard(post) {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition duration-300 overflow-hidden cursor-pointer';
        
        // Extract image from post body
        const imageUrl = this.extractFirstImage(post.body);
        
        // All posts already have commentrewarder (filtered server-side)
        const hasBeneficiary = true;
        
        // Get commentrewarder beneficiary percentage
        const beneficiaryPercent = this.getCommentrewarderPercent(post);
        
        // Format date
        const date = new Date(post.created).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Create excerpt
        const excerpt = this.createExcerpt(post.body, 150);

        card.innerHTML = `
            ${imageUrl ? `
                <div class="h-48 overflow-hidden">
                    <img src="${imageUrl}" alt="${this.escapeHtml(post.title)}" 
                         class="w-full h-full object-cover hover:scale-105 transition duration-300">
                </div>
            ` : ''}
            <div class="p-6">
                <div class="flex items-center justify-end mb-3">
                    <span class="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full">
                        <i class="fas fa-check-circle mr-1"></i>commentrewarder ${beneficiaryPercent}%
                    </span>
                </div>
                <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition">
                    ${this.escapeHtml(post.title)}
                </h2>
                <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    ${this.escapeHtml(excerpt)}
                </p>
                <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-user-circle"></i>
                        <span class="font-medium">@${this.escapeHtml(post.author)}</span>
                    </div>
                    <span>${date}</span>
                </div>
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
                    <div class="flex items-center space-x-4">
                        <span class="flex items-center text-gray-600 dark:text-gray-400">
                            <i class="fas fa-comment mr-1"></i>
                            ${post.children || 0} comments
                        </span>
                    </div>
                    <span class="font-semibold text-blue-600 dark:text-blue-400">
                        $${this.calculatePayout(post)}
                    </span>
                </div>
            </div>
            <div class="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-center space-x-2 text-sm">
                    <span class="text-gray-600 dark:text-gray-400 font-medium">View on:</span>
                    <a href="https://snapie.io/@${this.escapeHtml(post.author)}/${this.escapeHtml(post.permlink)}" 
                       target="_blank" 
                       class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                       onclick="event.stopPropagation()">
                        Snapie
                    </a>
                    <span class="text-gray-400">|</span>
                    <a href="https://peakd.com/@${this.escapeHtml(post.author)}/${this.escapeHtml(post.permlink)}" 
                       target="_blank" 
                       class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                       onclick="event.stopPropagation()">
                        PeakD
                    </a>
                    <span class="text-gray-400">|</span>
                    <a href="https://ecency.com/@${this.escapeHtml(post.author)}/${this.escapeHtml(post.permlink)}" 
                       target="_blank" 
                       class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                       onclick="event.stopPropagation()">
                        Ecency
                    </a>
                    <span class="text-gray-400">|</span>
                    <a href="https://hive.blog/@${this.escapeHtml(post.author)}/${this.escapeHtml(post.permlink)}" 
                       target="_blank" 
                       class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                       onclick="event.stopPropagation()">
                        Hive.blog
                    </a>
                </div>
            </div>
        `;

        return card;
    }

    extractFirstImage(body) {
        // Try to extract image from markdown
        const imgRegex = /!\[.*?\]\((.*?)\)/;
        const match = body.match(imgRegex);
        if (match && match[1]) {
            return match[1];
        }

        // Try HTML img tag
        const htmlImgRegex = /<img[^>]+src="([^">]+)"/;
        const htmlMatch = body.match(htmlImgRegex);
        if (htmlMatch && htmlMatch[1]) {
            return htmlMatch[1];
        }

        return null;
    }

    getCommentrewarderPercent(post) {
        try {
            const beneficiaries = post.beneficiaries || [];
            const commentrewarder = beneficiaries.find(b => b.account === 'commentrewarder');
            if (commentrewarder && commentrewarder.weight) {
                // weight is in basis points (10000 = 100%)
                return (commentrewarder.weight / 100).toFixed(0);
            }
        } catch (e) {
            return '0';
        }
        return '0';
    }

    checkCommentrewarderBeneficiary(post) {
        try {
            const metadata = JSON.parse(post.json_metadata || '{}');
            const beneficiaries = metadata.beneficiaries || [];
            return beneficiaries.some(b => b.account === 'commentrewarder');
        } catch (e) {
            return false;
        }
    }

    createExcerpt(body, maxLength) {
        // Remove markdown and HTML
        let text = body.replace(/!\[.*?\]\(.*?\)/g, '');
        text = text.replace(/<[^>]*>/g, '');
        text = text.replace(/[#*_~`]/g, '');
        text = text.trim();
        
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }

    calculatePayout(post) {
        const pendingPayout = parseFloat(post.pending_payout_value || '0');
        const totalPayout = parseFloat(post.total_payout_value || '0');
        const curatorPayout = parseFloat(post.curator_payout_value || '0');
        
        const total = pendingPayout + totalPayout + curatorPayout;
        return isNaN(total) ? '0.00' : total.toFixed(2);
    }

    showError(message) {
        this.postsContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-circle text-6xl text-red-400 mb-4"></i>
                <p class="text-red-600 text-lg">${message}</p>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TapintuApp();
});
