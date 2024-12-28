// frontend/src/pages/ProjectManagerAddTaskPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import '../styles/ProjectManagerTask.css';

function ProjectManagerAddTaskPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    // Basic Task form
    const [assignedTo, setAssignedTo] = useState('');
    const [deadline, setDeadline] = useState('');
    const [instructions, setInstructions] = useState('');

    // Annotators
    const [annotators, setAnnotators] = useState([]);

    // The collapsible tree data
    const [treeData, setTreeData] = useState([]);
    const [selectedPaths, setSelectedPaths] = useState(new Set());

    // NEW: All assigned paths for this project
    const [alreadyAssignedPaths, setAlreadyAssignedPaths] = useState(new Set());

    useEffect(() => {
        fetchAnnotators();
        fetchProjectTree();
        fetchAssignedItems();
        // eslint-disable-next-line
    }, [projectId]);

    async function fetchAnnotators() {
        try {
            // e.g. /auth/users?role_id=4
            const res = await API.get('/auth/users?role_id=4');
            setAnnotators(res.data.users || []);
        } catch (err) {
            console.error('[AddTaskPage] fetchAnnotators error:', err);
        }
    }

    // Tree data, skipping "Tasks" automatically from the backend
    async function fetchProjectTree() {
        try {
            const res = await API.get(`/auth/projects/${projectId}/files-tree`);
            setTreeData(res.data.tree || []);
        } catch (err) {
            console.error('[AddTaskPage] fetchProjectTree error:', err);
        }
    }

    // 2) Fetch all assigned items so we can highlight them
    async function fetchAssignedItems() {
        try {
            const res = await API.get(`/auth/projects/${projectId}/assigned-items`);
            const assigned = res.data.assignedPaths || [];
            setAlreadyAssignedPaths(new Set(assigned));
        } catch (err) {
            console.error('[AddTaskPage] fetchAssignedItems error:', err);
        }
    }

    // Create the new task
    async function handleCreateTask() {
        try {
            const body = {
                assigned_to: assignedTo || null,
                deadline: deadline || null,
                instructions: instructions || null,
            };
            const res = await API.post(`/auth/projects/${projectId}/tasks`, body);
            const newTaskId = res.data.taskId;

            // If we selected some files, copy them
            if (selectedPaths.size > 0) {
                await API.post(`/auth/projects/${projectId}/tasks/${newTaskId}/files`, {
                    selectedPaths: Array.from(selectedPaths),
                });
            }

            navigate(`/pm/projects/${projectId}`);
        } catch (err) {
            console.error('[AddTaskPage] handleCreateTask error:', err);
            alert('Failed to create task. Check console for details.');
        }
    }

    function handleCancel() {
        navigate(`/pm/projects/${projectId}`);
    }

    return (
        <div className="pm-add-task-container">
            <h2>Create New Task for Project #{projectId}</h2>

            <div className="task-form-section">
                <label>Assign to Annotator:</label>
                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                    <option value="">--Unassigned--</option>
                    {annotators.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.email}
                        </option>
                    ))}
                </select>

                <label>Deadline:</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />

                <label>Instructions:</label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </div>

            <div className="task-files-section">
                <h4>Select Folders/Files for this Task</h4>
                {treeData.length > 0 ? (
                    <CollapsibleTreeWithCheckbox
                        treeData={treeData}
                        selectedPaths={selectedPaths}
                        setSelectedPaths={setSelectedPaths}
                        alreadyAssignedPaths={alreadyAssignedPaths}
                    />
                ) : (
                    <p>No files found.</p>
                )}
            </div>

            <div className="task-buttons">
                <button onClick={handleCreateTask}>Create Task</button>
                <button onClick={handleCancel}>Cancel</button>
            </div>
        </div>
    );
}

/** Collapsible tree of checkboxes, with highlight for already-assigned items */
function CollapsibleTreeWithCheckbox({
    treeData,
    selectedPaths,
    setSelectedPaths,
    alreadyAssignedPaths,
}) {
    return (
        <ul className="file-tree">
            {treeData.map((node, idx) => (
                <TreeCheckboxNode
                    key={idx}
                    node={node}
                    selectedPaths={selectedPaths}
                    setSelectedPaths={setSelectedPaths}
                    alreadyAssignedPaths={alreadyAssignedPaths}
                />
            ))}
        </ul>
    );
}

function TreeCheckboxNode({
    node,
    selectedPaths,
    setSelectedPaths,
    alreadyAssignedPaths,
}) {
    const [isOpen, setIsOpen] = useState(false);

    const isChecked = selectedPaths.has(node.path);
    const isUsed = alreadyAssignedPaths.has(node.path); // highlight if assigned

    const toggleOpen = () => setIsOpen(!isOpen);

    const onCheckboxChange = (checked) => {
        const newSet = new Set(selectedPaths);
        if (checked) {
            newSet.add(node.path);
        } else {
            newSet.delete(node.path);
        }
        setSelectedPaths(newSet);
    };

    // We add style to show an "assigned" folder in a different color
    const assignedStyle = { color: 'red', fontWeight: 'bold' }; // or your choice

    if (node.type === 'directory') {
        return (
            <li className="tree-item">
                <div className="folder-header">
                    <span
                        className="folder-arrow"
                        onClick={toggleOpen}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && toggleOpen()}
                    >
                        {isOpen ? '⌄' : '>'}
                    </span>
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                            e.stopPropagation();
                            onCheckboxChange(e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <span className="folder-icon" style={isUsed ? assignedStyle : {}}>
                        📁 {node.name}
                    </span>
                </div>
                {isOpen && node.children && (
                    <ul className="folder-children">
                        {node.children.map((child, i) => (
                            <TreeCheckboxNode
                                key={i}
                                node={child}
                                selectedPaths={selectedPaths}
                                setSelectedPaths={setSelectedPaths}
                                alreadyAssignedPaths={alreadyAssignedPaths}
                            />
                        ))}
                    </ul>
                )}
            </li>
        );
    }

    // It's a file
    return (
        <li className="tree-item">
            <div className="file-row">
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onCheckboxChange(e.target.checked)}
                />
                <span className="file-icon" style={isUsed ? assignedStyle : {}}>
                    📄 {node.name}
                </span>
            </div>
        </li>
    );
}

export default ProjectManagerAddTaskPage;
