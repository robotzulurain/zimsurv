export const ANTIBIOTICS = ["All","Ampicillin","Ciprofloxacin","Ceftriaxone","Meropenem"].map(x=>({label:x,value:x==="All"?"":x}));
export const ORGANISMS  = ["All","Escherichia coli","Klebsiella","Salmonella","Pseudomonas"].map(x=>({label:x,value:x==="All"?"":x}));
export const HOSTS      = ["All","HUMAN","ANIMAL"].map(x=>({label:x,value:x==="All"?"":x}));
export const SEXES      = ["All","M","F"].map(x=>({label:x,value:x==="All"?"":x}));
