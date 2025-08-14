import { useCallback, useMemo } from 'react';

export default function usePropertyAgentLinkage({ allProperties = [], allAgents = [], allManagers = [], form, setForm, allAgentsLoading, allPropertiesLoading, allManagersLoading, user }) {
  const propertyMap = useMemo(() => {
    const map = new Map();
    allProperties.forEach(property => { map.set(property.property_code, property); });
    return map;
  }, [allProperties]);

  // Combine agents and managers based on user role
  const agentsWithManager = useMemo(() => {
    let combinedAgents = [...allAgents];
    
    // Add authenticated manager if user is a manager
    if (user?.role === "Manager" && user?.user_code) {
      const managerAgent = {
        user_code: user.user_code,
        name: user.name || 'Manager',
        isManager: true,
        role: 'Manager'
      };
      combinedAgents = [managerAgent, ...combinedAgents];
    }
    
    // Add managers based on user role
    if (user?.role === "Admin" || user?.role === "Super Admin") {
      const managerAgents = allManagers.map(manager => ({
        user_code: manager.manager_code,
        name: manager.name || 'Manager',
        isManager: true,
        role: 'Manager',
        manager_code: manager.manager_code,
        admin_code: manager.admin_code
      }));
      combinedAgents = [...managerAgents, ...combinedAgents];
    }
    
    return combinedAgents;
  }, [allAgents, allManagers, user]);

  const agentMap = useMemo(() => {
    const map = new Map();
    agentsWithManager.forEach(agent => { map.set(agent.user_code, agent); });
    return map;
  }, [agentsWithManager]);

  // Create a map of manager_code to agents for quick lookup
  const managerAgentsMap = useMemo(() => {
    const map = new Map();
    agentsWithManager.forEach(agent => {
      if (agent.manager_code) {
        if (!map.has(agent.manager_code)) {
          map.set(agent.manager_code, []);
        }
        map.get(agent.manager_code).push(agent);
      }
    });
    return map;
  }, [agentsWithManager]);

  const agentPropertyCounts = useMemo(() => {
    const counts = new Map();
    allProperties.forEach(property => {
      const count = counts.get(property.agent_code) || 0;
      counts.set(property.agent_code, count + 1);
    });
    return counts;
  }, [allProperties]);

  const agentOptions = useMemo(() => 
    agentsWithManager.map(agent => {
      const numProperties = agentPropertyCounts.get(agent.user_code) || 0;
      const isManager = agent.isManager || agent.role === 'Manager';
      const label = isManager 
        ? `${agent.user_code} - ${agent.name} (Manager)`
        : `${agent.user_code} - ${agent.name} (${numProperties} propert${numProperties === 1 ? 'y' : 'ies'})`;
      
      return {
        value: agent.user_code,
        label,
        numProperties,
        isManager,
        role: agent.role,
      };
    }), 
    [agentsWithManager, agentPropertyCounts]
  );

  const propertyOptions = useMemo(() => 
    allProperties.map(property => {
      const agent = agentMap.get(property.agent_code);
      return {
        value: property.property_code,
        label: `${property.property_code} - ${property.property_name}${agent ? ` (Agent: ${agent.name})` : ''}`,
        agentName: agent ? agent.name : '',
      };
    }), 
    [allProperties, agentMap]
  );

  const filteredProperties = useMemo(() => {
    if (!form.agentCode) return propertyOptions;
    
    const selectedAgent = agentMap.get(form.agentCode);
    if (!selectedAgent) return propertyOptions;

    // Check if the selected agent is a manager (has isManager flag or is in manager role)
    const isManager = selectedAgent.isManager || selectedAgent.role === 'Manager';
    
    if (isManager) {
      // If manager is selected, show properties assigned to agents under this manager
      const agentsUnderManager = managerAgentsMap.get(form.agentCode) || [];
      const agentCodesUnderManager = agentsUnderManager.map(agent => agent.user_code);
      
      const filtered = propertyOptions.filter(option => {
        const property = propertyMap.get(option.value);
        return property && agentCodesUnderManager.includes(property.agent_code);
      });
      
      return filtered;
    } else {
      // If regular agent is selected, show only their properties
      const filtered = propertyOptions.filter(option => {
        const property = propertyMap.get(option.value);
        return property && property.agent_code === form.agentCode;
      });
      
      return filtered;
    }
  }, [form.agentCode, propertyOptions, propertyMap, agentMap, managerAgentsMap]);

  const filteredAgents = useMemo(() => {
    // Don't filter agents based on property selection - let handleLinkedChange handle the logic
    return agentOptions;
  }, [agentOptions]);

  const propertyDropdownDisabled = useMemo(() => 
    !!form.agentCode && filteredProperties.length === 0, 
    [form.agentCode, filteredProperties.length]
  );

  const ariaProps = useMemo(() => ({
    agentDropdown: {
      'aria-label': 'Agent selection',
      role: 'combobox',
    },
    propertyDropdown: {
      'aria-label': 'Property selection',
      role: 'combobox',
    },
    noPropertyMessage: {
      role: 'alert',
      'aria-live': 'polite',
    },
  }), []);

  const handleLinkedChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name !== 'agentCode' && name !== 'propertyCode') {
      setForm(prev => ({ ...prev, [name]: value }));
      return;
    }

    setForm(prev => {
      if (name === 'agentCode') {
        return { ...prev, agentCode: value, propertyCode: '' };
      } else {
        // When property is selected, check if current agent is a manager
        const property = propertyMap.get(value);
        const currentAgent = agentMap.get(prev.agentCode);
        
        // Check if current agent is a manager
        const isCurrentAgentManager = currentAgent && (currentAgent.isManager || currentAgent.role === 'Manager');
        
        if (isCurrentAgentManager && property) {
          // If current agent is a manager, check if the selected property belongs to any agent under this manager
          const agentsUnderManager = managerAgentsMap.get(prev.agentCode) || [];
          const agentCodesUnderManager = agentsUnderManager.map(agent => agent.user_code);
          
          // If property belongs to an agent under this manager, keep the manager selected
          if (agentCodesUnderManager.includes(property.agent_code)) {
            return { ...prev, propertyCode: value };
          }
        }
        
        // Default behavior: set agent to property's agent (for regular agents or invalid property-manager combinations)
        return {
          ...prev,
          propertyCode: value,
          agentCode: property ? property.agent_code : '',
        };
      }
    });
  }, [setForm, propertyMap, agentMap, managerAgentsMap]);

  const validateAgentPropertyMatch = useCallback((formObj) => {
    if (!formObj.agentCode || !formObj.propertyCode) {
      return null;
    }
    
    const selectedAgent = agentMap.get(formObj.agentCode);
    const property = propertyMap.get(formObj.propertyCode);
    
    if (!property || !selectedAgent) {
      return 'Selected property does not belong to the selected agent.';
    }

    // Check if the selected agent is a manager
    const isManager = selectedAgent.isManager || selectedAgent.role === 'Manager';
    
    if (isManager) {
      // For manager, check if property belongs to any agent under this manager
      const agentsUnderManager = managerAgentsMap.get(formObj.agentCode) || [];
      const agentCodesUnderManager = agentsUnderManager.map(agent => agent.user_code);
      
      if (!agentCodesUnderManager.includes(property.agent_code)) {
        return 'Selected property does not belong to any agent under the selected manager.';
      }
    } else {
      // For regular agent, check direct assignment
      if (property.agent_code !== formObj.agentCode) {
        return 'Selected property does not belong to the selected agent.';
      }
    }
    
    return null;
  }, [propertyMap, agentMap, managerAgentsMap]);

  return {
    agentOptions: filteredAgents,
    propertyOptions: filteredProperties,
    propertyDropdownDisabled,
    handleLinkedChange,
    ariaProps,
    validateAgentPropertyMatch,
  };
}
