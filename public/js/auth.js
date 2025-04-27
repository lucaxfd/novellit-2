import api from './api.js';

class AuthService {
    constructor() {
        this.api = api;
    }

    async login(email, password) {
        try {
            const data = await this.api.login(email, password);
            return data;
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    }

    async register(username, email, password) {
        try {
            const data = await this.api.register(username, email, password);
            return data;
        } catch (error) {
            console.error('Erro no registro:', error);
            throw error;
        }
    }

    logout() {
        this.api.logout();
    }

    isAuthenticated() {
        return this.api.isAuthenticated();
    }

    getUser() {
        return this.api.getUser();
    }
}

// Exporta uma única instância do serviço
const auth = new AuthService();
export default auth;

// Função para obter a inicial do nome do usuário
function getUserInitial(name) {
    return name.charAt(0).toUpperCase();
}

// Função para verificar se o usuário está logado
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Função para obter os dados do usuário
function getUserData() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

// Função para atualizar a navegação
function updateNavigation() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    const isLoggedIn = localStorage.getItem('token') !== null;
    const navLinks = nav.querySelector('.nav-links');
    
    if (isLoggedIn) {
        // Remove login and register links
        const loginLink = navLinks.querySelector('a[href="/login"]');
        const registerLink = navLinks.querySelector('a[href="/register"]');
        if (loginLink) loginLink.remove();
        if (registerLink) registerLink.remove();
        
        // Add user avatar and menu
        const userData = JSON.parse(localStorage.getItem('user'));
        const userInitials = userData.name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
            <a href="/profile">Meu Perfil</a>
            <a href="/my-novels">Minhas Novels</a>
            <a href="/publish">Publicar</a>
            <div class="divider"></div>
            <a href="#" class="logout" onclick="logout()">Sair</a>
        `;
        
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        avatar.textContent = userInitials;
        avatar.appendChild(userMenu);
        
        navLinks.appendChild(avatar);
        
        // Add event listeners for menu toggle
        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            userMenu.classList.remove('show');
        });
    }
}

// Função para fazer logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Atualiza a navegação quando a página carregar
document.addEventListener('DOMContentLoaded', updateNavigation);

// Exporta as funções para uso global
window.updateNavigation = updateNavigation;
window.logout = logout; 