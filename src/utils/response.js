//response SUCESS
const success = (data, message = 'Succès', code = 200) => {
    return {
        status: "success",
        code,
        message,
        data
    };
} 

//response ERROR
const error = (message = 'Erreur', code = 500, data = null) => {
    return {
        status: "error",
        code,
        message,
        data
    };
}

module.exports = {
    success,
    error
};

