document.addEventListener('DOMContentLoaded', () => {
    
    const userId = 1; 

    const scoreElement = document.getElementById('user-score');

    fetch(`http://localhost:3000/usuarios/${userId}/pontuacao`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Usuário não encontrado ou erro no servidor.`);
            }
            return response.json();
        })
        .then(data => {
            scoreElement.textContent = data.pontuacao;
        })
        .catch(error => {
            console.error('Erro ao buscar pontuação:', error);
            scoreElement.textContent = 'Erro!';
        });
});