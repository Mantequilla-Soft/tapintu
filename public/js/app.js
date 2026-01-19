// Tapintu - Frontend Application
// Hive Posts Display with commentrewarder beneficiary

class TapintuApp {
    constructor() {
        this.postsContainer = document.getElementById('posts-container');
        this.loadingIndicator = document.getElementById('loading');
        this.emptyState = document.getElementById('empty-state');
        this.postModal = document.getElementById('post-modal');
        this.modalContent = document.getElementById('modal-content');
        
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

        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        this.postModal.addEventListener('click', (e) => {
            if (e.target === this.postModal) {
                this.closeModal();
            }
        });

        // Initialize dark mode from localStorage
        this.initDarkMode();
    }

    initDarkMode() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.documentElement.classList.add('dark');
            document.getElementById('dark-mode-icon').className = 'fas fa-sun';
        }
    }

    toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', isDark);
        const icon = document.getElementById('dark-mode-icon');
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
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
            const response = await fetch('/api/feed');
            const posts = await response.json();
            this.displayPosts(posts);
        } catch (error) {
            console.error('Error loading feed:', error);
            this.showError('Failed to load feed');
        } finally {
            this.hideLoading();
        }
    }

    displayPosts(posts) {
        this.postsContainer.innerHTML = '';
        
        if (!posts || posts.length === 0) {
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
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full">
                        ${this.escapeHtml(post.category)}
                    </span>
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

        card.addEventListener('click', () => {
            this.openPostModal(post.author, post.permlink);
        });

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

    async openPostModal(author, permlink) {
        try {
            this.postModal.classList.remove('hidden');
            this.modalContent.innerHTML = '<div class="flex justify-center py-12"><div class="loader"></div></div>';
            
            const response = await fetch(`/api/post/${author}/${permlink}`);
            const post = await response.json();
            
            this.displayPostDetails(post);
        } catch (error) {
            console.error('Error loading post details:', error);
            this.modalContent.innerHTML = '<p class="text-red-600">Failed to load post details</p>';
        }
    }

    displayPostDetails(post) {
        const date = new Date(post.created).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const hasBeneficiary = this.checkCommentrewarderBeneficiary(post);

        this.modalContent.innerHTML = `
            <div class="mb-6">
                ${hasBeneficiary ? `
                    <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <span class="text-sm text-green-800">
                            <i class="fas fa-check-circle mr-2"></i>
                            This post supports <strong>commentrewarder</strong> as beneficiary
                        </span>
                    </div>
                ` : ''}
                <div class="flex items-center justify-between mb-4">
                    <span class="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                        ${this.escapeHtml(post.category)}
                    </span>
                    <span class="text-sm text-gray-500">${date}</span>
                </div>
                <h1 class="text-3xl font-bold text-gray-900 mb-4">
                    ${this.escapeHtml(post.title)}
                </h1>
                <div class="flex items-center space-x-4 mb-6">
                    <div class="flex items-center space-x-2 text-gray-700">
                        <i class="fas fa-user-circle text-xl"></i>
                        <span class="font-medium">@${this.escapeHtml(post.author)}</span>
                    </div>
                    <div class="flex items-center space-x-4 text-sm text-gray-600">
                        <span><i class="fas fa-arrow-up text-green-600 mr-1"></i>${post.net_votes}</span>
                        <span><i class="fas fa-comment text-gray-600 mr-1"></i>${post.children}</span>
                        <span class="font-semibold text-blue-600">$${this.calculatePayout(post)}</span>
                    </div>
                </div>
            </div>
            <div class="prose max-w-none post-content mb-6">
                ${this.renderMarkdown(post.body)}
            </div>
            <div class="flex items-center justify-between pt-6 border-t border-gray-200">
                <a href="https://hive.blog/@${post.author}/${post.permlink}" 
                   target="_blank" 
                   class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200">
                    <i class="fas fa-external-link-alt mr-2"></i>View on Hive.blog
                </a>
                <div class="text-sm text-gray-500">
                    <i class="fas fa-tag mr-1"></i>
                    ${post.category}
                </div>
            </div>
        `;
    }

    renderMarkdown(markdown) {
        // Basic markdown to HTML conversion
        let html = markdown;
        
        // Images
        html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');
        
        // Paragraphs
        html = html.split('\n\n').map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('');
        
        return html;
    }

    closeModal() {
        this.postModal.classList.add('hidden');
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
