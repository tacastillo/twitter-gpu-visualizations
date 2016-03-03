function createSpan() { 
var spanTag = document.createElement("span"); 

spanTag.id = "span1"; 

spanTag.className = "dynamicSpan"; 

spanTag.innerHTML = "<b>HTML Span tag</b> " 
                    + "created by using "  
                    + "Javascript DOM dynamically."; 

document.getElementById("currentInfo").appendChild(spanTag); 
} 