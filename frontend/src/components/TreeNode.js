// frontend/src/components/TreeNode.js
import React, { useState } from 'react';

// node = { name: string, type: 'file'|'directory', children?: [] }

function TreeNode({ node }) {
    // Track whether this folder (if directory) is open or closed
    const [isOpen, setIsOpen] = useState(false);

    // If it's just a file, render a single <li>
    if (node.type === 'file') {
        return (
            <li className="tree-item file-item">
                <span className="file-icon">📄</span> {node.name}
            </li>
        );
    }

    // Otherwise, node.type === 'directory'
    return (
        <li className="tree-item directory-item">
            {/* Folder toggle */}
            <div
                className="folder-toggle"
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
            >
                <span className="folder-arrow">
                    {isOpen ? '▼' : '►'}
                </span>
                <span className="folder-icon">📁</span>
                {node.name}
            </div>
            {/* If open, render children */}
            {isOpen && node.children && (
                <ul className="folder-children">
                    {node.children.map((child, idx) => (
                        <TreeNode key={idx} node={child} />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default TreeNode;
