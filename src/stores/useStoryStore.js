import { create } from 'zustand';
import {
    applyNodeChanges,
    applyEdgeChanges,
    addEdge
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

const initialNodes = [
    {
        id: 'start',
        type: 'text',
        position: { x: 450, y: 300 }, // Snapped to 15 (15 * 30, 15 * 20)
        data: {
            label: 'Start Node',
            text: 'Welcome to your adventure. The path ahead is unknown.',
            image: 'https://placehold.co/600x400/2a2a2a/FFF',
        }
    }
];

const useStoryStore = create((set, get) => ({
    // Editor State
    nodes: initialNodes,
    edges: [],
    gridVisible: true,
    snapToGrid: true,
    isPlaying: false,

    onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
    },

    onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
    },

    onConnect: (connection) => {
        set({ edges: addEdge(connection, get().edges) });
    },

    addNode: (type = 'text', position = null) => {
        const id = uuidv4();
        let data = { label: `${type.charAt(0).toUpperCase() + type.slice(1)}` };

        if (type === 'text') {
            data = { ...data, text: 'Edit this text...', image: '' };
        } else if (type === 'choice') {
            data = { ...data, text: 'What do you do?', choices: [{ id: Date.now(), text: 'Choice' }] };
        } else if (type === 'dice') {
            data = { ...data, text: 'Roll check...', variable: 'strength', target: 10 };
        }

        // Strictly snap to 15px grid
        const snap = (val) => Math.round(val / 15) * 15;

        const finalPosition = position
            ? { x: snap(position.x), y: snap(position.y) }
            : {
                x: snap(Math.random() * 400 + 100),
                y: snap(Math.random() * 400 + 100)
            };

        const newNode = {
            id,
            type,
            position: finalPosition,
            data: { ...data, isPinned: false }
        };
        set({ nodes: [...get().nodes, newNode] });
        return id;
    },

    deleteNode: (id) => {
        set({
            nodes: get().nodes.filter((node) => node.id !== id),
            edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
        });
    },

    toggleNodePin: (id) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id === id) {
                    const isPinned = node.data?.isPinned;
                    return {
                        ...node,
                        draggable: !!isPinned, // If it was pinned, make it draggable again
                        data: { ...node.data, isPinned: !isPinned }
                    };
                }
                return node;
            }),
        });
    },

    toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),
    toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

    deleteEdge: (id) => {
        set({
            edges: get().edges.filter((edge) => edge.id !== id),
        });
    },

    loadStory: (nodes, edges) => {
        set({
            nodes: Array.isArray(nodes) ? nodes : get().nodes,
            edges: Array.isArray(edges) ? edges : get().edges,
        });
    },

    clearToStartNode: () => {
        set({
            nodes: [...initialNodes],
            edges: [],
        });
    },

    updateNodeData: (id, data) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id === id) {
                    return { ...node, data: { ...node.data, ...data } };
                }
                return node;
            }),
        });
    },

    // Game State
    currentNodeId: 'start',
    history: ['start'],
    variables: {}, // { gold: 10, hp: 100 }

    setPlaying: (playing) => set({ isPlaying: playing }),

    playNode: (nodeId) => {
        set({ currentNodeId: nodeId, isPlaying: true });
    },

    setCurrentNode: (nodeId) => {
        set((state) => ({
            currentNodeId: nodeId,
            history: [...state.history, nodeId]
        }));
    },

    setVariable: (key, value) => {
        set((state) => ({
            variables: { ...state.variables, [key]: value }
        }));
    },

    resetGame: () => {
        set({ currentNodeId: 'start', history: ['start'], variables: {}, isPlaying: false });
    },

    // Helper to find next node ID based on handle
    getConnectedNodeId: (nodeId, sourceHandle = null) => {
        const { edges } = get();
        // Compare as strings to be safe with numeric choice IDs
        const edge = edges.find(
            (e) => e.source === nodeId && (sourceHandle === null || String(e.sourceHandle) === String(sourceHandle))
        );
        return edge ? edge.target : null;
    }
}));

export default useStoryStore;
