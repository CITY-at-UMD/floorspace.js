import factory from './../../factory/index.js'
export default {
    namespaced: true,
    // each story owns a geometry object with a unique set of vertices, edges, and faces
    state: [/*{
        id: null,
        vertices: [{
            id: null,
            x: null,
            y: null
        }],
        edges: [{
            id: null,
            p1: null,
            p2: null
        }],
        faces: [{
            id: null,
            edges: [{
                edge_id: null,
                reverse: false
            }]
        }]
    }*/],
    actions: {
        // initialize a new geometry object for a story
        initGeometry (context, payload) {
            // create the geometry object
            context.commit('initGeometry');
            const geometry_id = context.state[context.state.length - 1].id;

            // update the story with the geometry object
            context.commit('models/updateStoryWithData', {
                id: context.rootState.application.currentSelections.story_id,
                geometry_id: geometry_id
            }, {'root': true})
        },
        // this action destroys a face and all related geometric entities which are not referenced by other faces
        destroyFace (context, payload) {

            const geometry = payload.geometry;
            const space = payload.space;

            // the face to delete
            const expiredFace = geometry.faces.find((f) => {
                return f.id === space.face_id;
            });

            // destroy edges belonging to the face unless they are referenced by another face
            var isShared;
            expiredFace.edges.forEach((edgeRef) => {
                isShared = false;
                geometry.faces.forEach((f) => {
                    // only test other faces for reference to the edge
                    if (expiredFace === f) { return; }
                    isShared = f.edges.find((e) => {
                        return e.edge_id === edgeRef.edge_id;
                    }) || isShared;
                });

                // edge is not shared with another face, destroy it and its vertices unless they are shared with edges on other faces
                if (!isShared) {

                    var p1Shared = false,
                        p2Shared = false;

                    const expiredEdge = geometry.edges.find((e) => {
                        return e.id === edgeRef.edge_id;
                    });

                    // loop through each edge reference on each face
                    geometry.faces.forEach((f) => {
                        // only test other faces for reference to the vertex
                        if (expiredFace === f) { return; }

                        // lookup the edge object for each edge reference
                        f.edges.forEach((eR) => {
                            const e = geometry.edges.find((e) => {
                                return e.id === edgeRef.edge_id;
                            });

                            p1Shared = (e.p1 === expiredEdge.p1 || e.p2 === expiredEdge.p1) ? true : p1Shared;
                            p1Shared = (e.p1 === expiredEdge.p2 || e.p2 === expiredEdge.p2) ? true : p1Shared;
                        });
                    });
                    if (!p1Shared) {
                        context.commit('destroyVertex', {
                            geometry: geometry,
                            'vertex_id': expiredEdge.p1
                        });
                    }
                    if (!p2Shared) {
                        context.commit('destroyVertex', {
                            geometry: geometry,
                            'vertex_id': expiredEdge.p2
                        });
                    }

                    // destroy the edge
                    context.commit('destroyEdge', {
                        geometry: geometry,
                        'edge_id': edgeRef.edge_id
                    });
                }
            });
            // destroy the face
            context.commit('destroyFace', {
                geometry: geometry,
                'face_id': space.face_id
            });
        },
        createFaceFromPoints (context, payload) {
            // geometry and space for the current story
            const geometry = context.rootGetters['application/currentStoryGeometry'];
            const space = context.rootGetters['application/currentSpace'];

            // if the space already had an associated face, destroy it
            if (space.face_id) {
                context.dispatch('destroyFace', {
                    'geometry': geometry,
                    'space': space,
                    'face_id': space.face_id
                });
            }

            context.commit('createFace', {
                ...payload,
                'geometry': geometry,
                'space': space
            });
        }
    },
    mutations: {
        // initialize a new geometry object
        // must update the associated story to reference the geometry
        initGeometry (state, payload) {
            const geometry = new factory.Geometry();
            state.push(geometry);
        },
        createVertex (state, payload) {
            state.geometry.vertices.splice(state.geometry.vertices.findIndex((v) => {
                return v.id === payload.vertex_id;
            }), 1);
        },
        createEdge (state, payload) {
            state.geometry.edges.splice(state.geometry.edges.findIndex((e) => {
                return e.id === payload.edge_id;
            }), 1);
        },
        createFace (state, payload) {
            // geometry and space for the current story
            const geometry = payload.geometry;
            const space = payload.space;

            // build arrays of the vertices and edges associated with the face being created
            var faceVertices = [],
                faceEdges = [];

            payload.points.forEach((p, i) => {
                const vertex = new factory.Vertex(p.x, p.y);
                geometry.vertices.push(vertex);
                faceVertices.push(vertex);
            });

            faceVertices.forEach((v, i) => {
                const v2 = faceVertices.length > i + 1 ? faceVertices[i + 1] : faceVertices[0];
                const edge = new factory.Edge(v.id, v2.id);
                geometry.edges.push(edge);
                faceEdges.push(edge);
            });

            const edgeRefs = faceEdges.map((e, i) => {
                return {
                    edge_id: e.id,
                    reverse: false // TODO: implement a check for existing edges using the same vertices
                };
            });
            const face = new factory.Face(edgeRefs);
            geometry.faces.push(face);
            space.face_id = face.id;
        },

        destroyVertex (state, payload) {
            const geometry = payload.geometry;
            geometry.vertices.splice(geometry.vertices.findIndex((v) => {
                return v.id === payload.vertex_id;
            }), 1);
        },
        destroyEdge (state, payload) {
            const geometry = payload.geometry;
            geometry.edges.splice(geometry.edges.findIndex((e) => {
                return e.id === payload.edge_id;
            }), 1);
        },
        destroyFace (state, payload) {
            const geometry = payload.geometry;
            geometry.faces.splice(geometry.faces.findIndex((f) => {
                return f.id === payload.face_id;
            }), 1);
        }
    },
    getters: {}
}