window.onload = () => {
    let scrollCallbacks = []
    const updateScroll = () => {
        scrollCallbacks.forEach(e => e(window.scrollY))
    }
    const elements = document.querySelectorAll('*[data-scroll]')
    scrollCallbacks = Array.from(elements).map(e => {
        const code = e.getAttribute('data-scroll')
        return eval(`() => function($value) { ${code} }`)().bind(e)
    })
    updateScroll()
    document.addEventListener('scroll', updateScroll)

    let sent = false
    function mailSubmit(event) {
        if(sent) {
            return
        }
        event.preventDefault()
        const data = Array.from(
            event.currentTarget.querySelectorAll('input, select, textarea')
            ).reduce((curr, el) => ({
                ...curr, 
                [el.name]: el.type === 'checkbox' ? el.checked : el.value
            }), {})
        const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i
        if(!emailRegex.test(data.email)) {
            alert('Invalid email address')
            return
        }
        sent = true
        fetch('/mail', {
            body: JSON.stringify(data),
            method: 'POST'
        })
            .then(e => e.json())
            .then(e => {
                alert(e.title + '\n\n\n' + e.body)
            }).catch(err => {
                alert('Ocorreu um erro')
            })
        debugger
    }

    Array.from(document.querySelectorAll('form.mail')).forEach(form => form.addEventListener('submit', mailSubmit))

    // Close the dropdown menu if the user clicks outside of it
    window.onclick = function(event) {
        if (!event.target.matches('.dropbtn')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            var i;
            for (i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
        }
    }
}
