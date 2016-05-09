
__kernel void spring(
	__global float4 *position,
	__global int *source,
	__global int *target,
    __global int *ids,
	__global float4 *sourceAcc,
	__global float4 *targetAcc,
    float cSpring,
	int numEdge
	)
{
    const int s = get_global_id(0);
    if (s >= numEdge) return;
    
    // float cSpring = (float)0.03;

    // id is the node id
    const int id1 = source[s];
    const int id2 = target[s];
    // p is the sequence id in the node list
    const int p1 = ids[id1];
    const int p2 = ids[id2]; 
    
    // get the direction of the spring
    float4 direction = position[p2] - position[p1];
    float distance = length(direction);

    // direction *= (float)1.0 / fmax(distance, (float)0.1f);

    
    // // apply forces
    float4 force1 = direction * distance / cSpring;
    float4 force2 = - direction * distance / cSpring;
    
    // // output sum to point acceleration slot in global memory
    // // each edge has a force slot 
    sourceAcc[s] = force1;
    targetAcc[s] = force2;
}
