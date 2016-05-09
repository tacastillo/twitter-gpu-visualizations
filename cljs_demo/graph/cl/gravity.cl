__kernel void gravity(
	__global float4 *position,
	__global float4 *acceleration,
	float cGravity,
	int numNode)
{
	float cMass = (float) 1.0;
    const int p = get_global_id(0);
    if (p >= numNode) return;
    
    // float4 direction = position[p];
    // float r = length(direction);
    // float4 force = direction/r * centerAttraction * (float)-1.0;
    // acceleration[p] += force  / cMass;
}