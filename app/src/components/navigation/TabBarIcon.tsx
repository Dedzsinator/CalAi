import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

interface TabBarIconProps {
    name: keyof typeof MaterialIcons.glyphMap;
    color: string;
    size: number;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ name, color, size }) => {
    return <MaterialIcons name={name} size={size} color={color} />;
};

export default TabBarIcon;
