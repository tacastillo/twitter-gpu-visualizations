
inline float snoise(float2 co){
    float noise =  sin(dot(co.xy ,float2(12.9898,78.233))) * 43758.5453;
    noise -= floor(noise);
    // float noise = 1.0f;
    return noise;
}

__kernel void repulsion(
	__global float4 *position,
	__global float4 *acceleration,
    float cRepulsion,
    int skip,
	int numNode)
{
	// float cRepulsion = (float) 1.0;
	float cMass = (float) 1.0;
    const int p1 = get_global_id(0);
    if (p1 >= numNode) return;
    
    float4 pos1 = position[p1];
    float4 accSum = 0;
    for(int p2 = 0; p2< numNode; p2+=(skip+1)){
    	if(p1 == p2) continue;

    	float4 dir = pos1 - position[p2];
    	float distance = length(dir);
    	dir *= (float) 1 / fmax(distance, (float) 0.1f);
    	float f = cRepulsion * cRepulsion / fmax(distance, (float) 0.005f);
    	float4 force = dir * f;
    	accSum += force / cMass;

        // int skip = (int) (snoise(float2((float) p1, (float) p2)) * 100);
        // p2+=skip;

    }
    acceleration[p1] += accSum;   
}
