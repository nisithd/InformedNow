import authManager from './auth.mjs';

function handleResponse(res) {
    if (res.status >= 400) {
        return res.text().then(text => { 
            throw new Error(`${text} (status: ${res.status})`)
        }); 
    }
    return res.json();
}

// ==================== GALLERY LIST API ====================

// get paginated list of galleries
export function getGalleries(page, fail, success) {
    fetch(`/api/galleries/?page=${page}`, {
        credentials: 'include'
    })
        .then(handleResponse)
        .then(success)
        .catch(fail);
}

// ==================== USER-SPECIFIC GALLERY API ====================

// get specific user's gallery images
export function getUserImages(userId, fail, success) {
    fetch(`/api/users/${userId}/images/`, {
        credentials: 'include'
    })
        .then(handleResponse)
        .then(success)
        .catch(fail);
}

// get image at specific position in user's gallery (0 = newest)
export function getUserImagePosition(userId, position, fail, success) {
    fetch(`/api/users/${userId}/images/current/${position}`, {
        credentials: 'include'
    })
        .then(handleResponse)
        .then(success)
        .catch(fail);
}

// get user's image count
export function getUserImageCount(userId, fail, success) {
    fetch(`/api/users/${userId}/images/count`, {
        credentials: 'include'
    })
        .then(handleResponse)
        .then(success)
        .catch(fail);
}

// add an image to the gallery via file upload
export function addImage(title, userId, imageFile, fail, success) {
    if (!authManager.isAuthenticated()) {
        fail(new Error('User not authenticated'));
        return;
    }

    const data = new FormData();
    data.append("title", title);
    data.append("image", imageFile);
    
    fetch(`/api/users/${userId}/images/`, {
        method: "POST",
        body: data,
        credentials: 'include'
    })
    .then(handleResponse)
    .then(success)
    .catch(fail);
}

// delete an image from user's gallery
export function deleteImage(userId, imageId, fail, success) {
    fetch(`/api/users/${userId}/images/${imageId}`, {
        method: "DELETE",
        credentials: 'include'
    })
    .then(handleResponse)
    .then(success)
    .catch(fail);
}

// ==================== COMMENT API ====================

// get all comments for a specific image (first page)
export function getComments(imageId, fail, success) {
    fetch(`/api/images/${imageId}/comments?page=0`, {
        credentials: 'include'
    })
        .then(handleResponse)
        .then(success)
        .catch(fail);
}

// get comments for a specific image and page
export function getCommentsPage(imageId, page, fail, success) {
    fetch(`/api/images/${imageId}/comments?page=${page}`, {
        credentials: 'include'
    })
        .then(handleResponse)
        .then(data => success(data))
        .catch(fail);
}

// add a comment to an image
export function addComment(imageId, content, fail, success) {
    fetch(`/api/images/${imageId}/comments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: content
        }),
        credentials: 'include'
    })
    .then(handleResponse)
    .then(success)
    .catch(fail);
}


// delete a comment
export function deleteComment(commentId, fail, success) {
    fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        credentials: 'include'
    })
    .then(handleResponse)
    .then(success)
    .catch(fail);
}