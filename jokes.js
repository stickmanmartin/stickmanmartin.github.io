document.addEventListener('DOMContentLoaded', () => {
    const jokeDiv = document.getElementById('joke');
    const jokeButton = document.getElementById('newJokeButton');

    function fetchJoke() {
        fetch('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            jokeDiv.innerHTML = `<p>${data.joke}</p>`;
        })
        .catch(error => {
            console.error('Error fetching the joke:', error);
            jokeDiv.innerHTML = `<p>Failed to fetch a dad joke. Please try again later.</p>`;
        });
    }

    // Fetch a joke on page load
    fetchJoke();

    // Fetch a new joke when the button is clicked
    jokeButton.addEventListener('click', fetchJoke);
});
