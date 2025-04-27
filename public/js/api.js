class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers
            });

            if (response.status === 401) {
                this.clearStorage();
                window.location.href = '/login';
                return null;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }

    // Auth
    async login(email, password) {
        try {
            const data = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (data && data.token) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                return { success: true };
            }

            return { success: false, error: data.error || 'Erro ao fazer login' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async register(name, email, password) {
        try {
            const data = await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password })
            });

            if (data && data.token) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                return { success: true };
            }

            return { success: false, error: data.error || 'Erro ao registrar' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    logout() {
        this.clearStorage();
        window.location.href = '/login';
    }

    clearStorage() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
    }

    // Novels
    async getNovels(page = 1, limit = 10) {
        return this.request(`/novels?page=${page}&limit=${limit}`);
    }

    async getNovel(id) {
        return this.request(`/novels/${id}`);
    }

    async createNovel(novelData) {
        return this.request('/novels', {
            method: 'POST',
            body: JSON.stringify(novelData)
        });
    }

    // Chapters
    async getChapters(novelId) {
        return this.request(`/novels/${novelId}/chapters`);
    }

    async createChapter(novelId, chapterData) {
        return this.request(`/novels/${novelId}/chapters`, {
            method: 'POST',
            body: JSON.stringify(chapterData)
        });
    }

    // Comments
    async getComments(novelId) {
        return this.request(`/novels/${novelId}/comments`);
    }

    async createComment(novelId, content) {
        return this.request(`/novels/${novelId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }

    // Favorites
    async toggleFavorite(novelId) {
        return this.request(`/novels/${novelId}/favorite`, {
            method: 'POST'
        });
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user;
    }
}

const api = new ApiService();
export default api; 