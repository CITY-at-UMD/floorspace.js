export default {
  name(object, store, value, type) {
    let objs = store.getters['models/all'];

    switch (type) {
      case 'stories':
        objs = store.state.models.stories;
        break;
      case 'spaces':
        objs = store.getters['models/allSpaces'];
        break;
      case 'shading':
        objs = store.getters['models/allShading'];
        break;
      case 'images':
        objs = store.getters['models/allImages'];
        break;
      default:
        objs = store.state.models.library[type];
        break;
    }
    let error = '';
    if (objs.filter(s => (s.name === value) && (s.id !== object.id)).length) {
      error = 'Names must be unique.';
    } else if (value.length < 5) {
      error = 'Names must be at least 5 characters long.';
    }

    return error ? { success: false, error } : { success: true };
  },
  number(object, store, value, type) {
    let error = '';
    if (isNaN(value)) {
      error = 'Value must be numeric.';
    }

    return error ? { success: false, error } : { success: true };
  },
};
