let memoryBlocks = [];
let lastAllocatedIndex = -1;

function setupMemory() {
  const memoryInput = document.getElementById('memoryInput').value.trim();
  const memoryContainer = document.getElementById('memoryContainer');
  
  if (!memoryInput) {
    showAlert('Please enter memory block sizes');
    return;
  }
  
  try {
    memoryBlocks = memoryInput.split(',').map(size => {
      const parsed = parseInt(size.trim());
      if (isNaN(parsed) || parsed <= 0) throw new Error('Invalid memory size');
      return { size: parsed, allocated: false, processId: null };
    });
  } catch (error) {
    showAlert('Please enter valid memory block sizes (positive numbers separated by commas)');
    return;
  }
  
  renderMemory();
  lastAllocatedIndex = -1;
  document.getElementById('allocationDetails').innerHTML = '<div class="alert alert-success">Memory blocks initialized successfully.</div>';
}

function allocateProcesses() {
  const processInput = document.getElementById('processInput').value.trim();
  const algorithm = document.getElementById('algorithmSelect').value;
  
  if (!processInput) {
    showAlert('Please enter process sizes');
    return;
  }
  
  if (memoryBlocks.length === 0) {
    showAlert('Please set up memory blocks first');
    return;
  }
  
 memoryBlocks.forEach(block => {
    block.allocated = false;
    block.processId = null;
  });
  lastAllocatedIndex = -1;
  
  let processSizes = [];
  try {
    processSizes = processInput.split(',').map(size => {
      const parsed = parseInt(size.trim());
      if (isNaN(parsed) || parsed <= 0) throw new Error('Invalid process size');
      return parsed;
    });
  } catch (error) {
    showAlert('Please enter valid process sizes (positive numbers separated by commas)');
    return;
  }
  
  const allocationResults = [];
  
  processSizes.forEach((size, index) => {
    const processId = index + 1;
    let allocated = false;
    
    switch (algorithm) {
      case 'firstFit':
        allocated = applyFirstFit(size, processId);
        break;
      case 'bestFit':
        allocated = applyBestFit(size, processId);
        break;
      case 'worstFit':
        allocated = applyWorstFit(size, processId);
        break;
      case 'nextFit':
        allocated = applyNextFit(size, processId);
        break;
    }
    
    allocationResults.push({
      processId,
      size,
      allocated,
      blockIndex: allocated ? lastAllocatedIndex : -1
    });
  });
  
  renderMemory();
  displayAllocationDetails(allocationResults, algorithm);
}

function applyFirstFit(processSize, processId) {
  for (let i = 0; i < memoryBlocks.length; i++) {
    if (!memoryBlocks[i].allocated && memoryBlocks[i].size >= processSize) {
      memoryBlocks[i].allocated = true;
      memoryBlocks[i].processId = processId;
      lastAllocatedIndex = i;
      return true;
    }
  }
  return false;
}

function applyBestFit(processSize, processId) {
  let bestFitIndex = -1;
  let bestFitSize = Infinity;
  
  for (let i = 0; i < memoryBlocks.length; i++) {
    if (!memoryBlocks[i].allocated && memoryBlocks[i].size >= processSize) {
      if (memoryBlocks[i].size < bestFitSize) {
        bestFitSize = memoryBlocks[i].size;
        bestFitIndex = i;
      }
    }
  }
  
  if (bestFitIndex !== -1) {
    memoryBlocks[bestFitIndex].allocated = true;
    memoryBlocks[bestFitIndex].processId = processId;
    lastAllocatedIndex = bestFitIndex;
    return true;
  }
  return false;
}

function applyWorstFit(processSize, processId) {
  let worstFitIndex = -1;
  let worstFitSize = -1;
  
  for (let i = 0; i < memoryBlocks.length; i++) {
    if (!memoryBlocks[i].allocated && memoryBlocks[i].size >= processSize) {
      if (memoryBlocks[i].size > worstFitSize) {
        worstFitSize = memoryBlocks[i].size;
        worstFitIndex = i;
      }
    }
  }
  
  if (worstFitIndex !== -1) {
    memoryBlocks[worstFitIndex].allocated = true;
    memoryBlocks[worstFitIndex].processId = processId;
    lastAllocatedIndex = worstFitIndex;
    return true;
  }
  return false;
}

function applyNextFit(processSize, processId) {
  const startIndex = (lastAllocatedIndex + 1) % memoryBlocks.length;
  
  for (let i = 0; i < memoryBlocks.length; i++) {
    const index = (startIndex + i) % memoryBlocks.length;
    if (!memoryBlocks[index].allocated && memoryBlocks[index].size >= processSize) {
      memoryBlocks[index].allocated = true;
      memoryBlocks[index].processId = processId;
      lastAllocatedIndex = index;
      return true;
    }
  }
  
  return false;
}

function renderMemory() {
  const memoryContainer = document.getElementById('memoryContainer');
  memoryContainer.innerHTML = '';
  
  const row = document.createElement('div');
  row.className = 'row';
  
  const totalMemory = memoryBlocks.reduce((sum, block) => sum + block.size, 0);
  
  memoryBlocks.forEach((block, index) => {
    const blockDiv = document.createElement('div');
    blockDiv.className = `col memory-block ${block.allocated ? 'memory-allocated' : 'memory-free'}`;
    const width = (block.size / totalMemory) * 100;
    blockDiv.style.width = `${width}%`;
    blockDiv.style.minWidth = '50px';
    
    const label = block.allocated 
      ? `P${block.processId} (${block.size}KB)` 
      : `Free ${block.size}KB`;
      
    blockDiv.textContent = label;
    row.appendChild(blockDiv);
  });
  
  memoryContainer.appendChild(row);
}

function displayAllocationDetails(results, algorithm) {
  const detailsContainer = document.getElementById('allocationDetails');
  
  const algorithmExplanations = {
    firstFit: 'First Fit allocates to the first block that is large enough',
    bestFit: 'Best Fit allocates to the smallest block that can fit the process',
    worstFit: 'Worst Fit allocates to the largest block available',
    nextFit: 'Next Fit continues search from where the last allocation finished'
  };
  
  let html = `
    <h5>Allocation Results (${algorithm})</h5>
    <p>${algorithmExplanations[algorithm]}</p>
    <div class="table-responsive">
      <table class="table table-striped table-sm">
        <thead>
          <tr>
            <th>Process ID</th>
            <th>Size (KB)</th>
            <th>Status</th>
            <th>Block Allocated</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  results.forEach(result => {
    html += `
      <tr>
        <td>P${result.processId}</td>
        <td>${result.size}</td>
        <td>${result.allocated ? 'Allocated' : 'Failed'}</td>
        <td>${result.allocated ? `Block ${result.blockIndex + 1} (${memoryBlocks[result.blockIndex].size}KB)` : 'N/A'}</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
    
    <h5>Memory Block Status</h5>
    <div class="table-responsive">
      <table class="table table-striped table-sm">
        <thead>
          <tr>
            <th>Block #</th>
            <th>Size (KB)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  memoryBlocks.forEach((block, i) => {
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${block.size}</td>
        <td>${block.allocated ? `Allocated to P${block.processId}` : 'Free'}</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  detailsContainer.innerHTML = html;
}

function showAlert(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show';
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  const container = document.querySelector('.container');
  container.insertBefore(alertDiv, container.firstChild);
  
  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => alertDiv.remove(), 300);
  }, 3000);
}