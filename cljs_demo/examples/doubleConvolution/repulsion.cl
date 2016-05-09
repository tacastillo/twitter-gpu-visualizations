
__kernel void repulsion(__global float4 *pointPosition)
{
    const int p1 = get_global_id(0);
    if (p1 >= 3) return;
    
    pointPosition[p1]+= 10.0;
}
