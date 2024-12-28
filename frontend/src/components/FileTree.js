// frontend/src/components/FileTree.js
import React, { useState } from 'react';

function FileTree({ treeData, highlightPaths }) {
    return (
        <ul className="file-tree">
            {treeData.map((node, idx) => (
                <TreeNode key={idx} node={node} highlightPaths={highlightPaths} />
            ))}
        </ul>
    );
}

function TreeNode({ node, highlightPaths }) {
    const [isOpen, setIsOpen] = useState(false);
    const isHighlighted = highlightPaths?.has(node.path);
    const highlightStyle = { color: 'red', fontWeight: 'bold' };

    if (node.type === 'directory') {
        return (
            <li>
                <div onClick={() => setIsOpen(!isOpen)} style={isHighlighted ? highlightStyle : {}}>
                    {isOpen ? '⌄' : '>'} 📁 {node.name}
                </div>
                {isOpen && node.children && (
                    <ul>
                        {node.children.map((child, i) => (
                            <TreeNode key={i} node={child} highlightPaths={highlightPaths} />
                        ))}
                    </ul>
                )}
            </li>
        );
    }

    // file
    return (
        <li style={isHighlighted ? highlightStyle : {}}>
            📄 {node.name}
        </li>
    );
}

export default FileTree;
