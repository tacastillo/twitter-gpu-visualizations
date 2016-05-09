__kernel void updatePosition(__global float4 *acc,
							 __global float4 *pos,
                             __global float4 *vel,
                             float damp,
                             float deltaT,
                             float T, //temperature
                             const int numNode)
{
	// float damp = 0.8;
	// float deltaT = 1.0;

    int p = get_global_id(0);
    if (p >= numNode) return;
    
    float4 thisAcc=acc[p];
    float a = length(thisAcc);
    thisAcc *= fmin(a, T) / a;
    vel[p] += thisAcc*deltaT;
    vel[p] *= damp;

    pos[p] += vel[p]*deltaT;
}
