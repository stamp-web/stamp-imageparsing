/*
 Copyright 2019 Jason Drake (jadrake75@gmail.com)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
package com.drakeserver.image.model;

import java.awt.Rectangle;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;



/**
 * A Bounding Box is like a java.awt.Rectangle but without the Rectangle2D Overhead
 * holding just the x,y top left coordinate and the width and height.  This makes it
 * lighter weight as a bean like object.
 * 
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class BoundingBox {

	protected int x;
	protected int y;
	protected int width;
	protected int height;
		
	/**
     * Determines whether or not this {@code BoundingBox} and the specified
     * {@code BoundingBox} intersect. Two rectangles intersect if
     * their intersection is nonempty.
     *
     * @param r the specified {@code BoundingBox}
     * @return    {@code true} if the specified {@code BoundingBox}
     *            and this {@code BoundingBox} intersect;
     *            {@code false} otherwise.
     */
    public boolean intersects(BoundingBox r) {
        int tw = this.width;
        int th = this.height;
        int rw = r.width;
        int rh = r.height;
        if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
            return false;
        }
        int tx = this.x;
        int ty = this.y;
        int rx = r.x;
        int ry = r.y;
        rw += rx;
        rh += ry;
        tw += tx;
        th += ty;
        //      overflow || intersect
        return ((rw < rx || rw > tx) &&
                (rh < ry || rh > ty) &&
                (tw < tx || tw > rx) &&
                (th < ty || th > ry));
    }

    /**
     * Computes the intersection of this {@code BoundingBox} with the
     * specified {@code BoundingBox}. Returns a new {@code BoundingBox}
     * that represents the intersection of the two rectangles.
     * If the two rectangles do not intersect, the result will be
     * an empty rectangle.
     *
     * @param     r   the specified {@code BoundingBox}
     * @return    the largest {@code BoundingBox} contained in both the
     *            specified {@code BoundingBox} and in
     *            this {@code BoundingBox}; or if the rectangles
     *            do not intersect, an empty rectangle.
     */
    public BoundingBox intersection(BoundingBox r) {
        int tx1 = this.x;
        int ty1 = this.y;
        int rx1 = r.x;
        int ry1 = r.y;
        long tx2 = tx1; tx2 += this.width;
        long ty2 = ty1; ty2 += this.height;
        long rx2 = rx1; rx2 += r.width;
        long ry2 = ry1; ry2 += r.height;
        if (tx1 < rx1) tx1 = rx1;
        if (ty1 < ry1) ty1 = ry1;
        if (tx2 > rx2) tx2 = rx2;
        if (ty2 > ry2) ty2 = ry2;
        tx2 -= tx1;
        ty2 -= ty1;
        // tx2,ty2 will never overflow (they will never be
        // larger than the smallest of the two source w,h)
        // they might underflow, though...
        if (tx2 < Integer.MIN_VALUE) tx2 = Integer.MIN_VALUE;
        if (ty2 < Integer.MIN_VALUE) ty2 = Integer.MIN_VALUE;
        BoundingBox b = new BoundingBox(tx1, ty1, (int) tx2, (int) ty2);
        return b;
    }
	
	/**
     * Checks whether or not this {@code BoundingBox} entirely contains
     * the specified {@code BoundingBox}.
     *
     * @param     r   the specified {@code BoundingBox}
     * @return    {@code true} if the {@code BoundingBox}
     *            is contained entirely inside this {@code BoundingBox};
     *            {@code false} otherwise
     * @since     1.2
     */
    public boolean contains(BoundingBox r) {
    	int X = r.x;
    	int Y = r.y;
    	int H = r.height;
    	int W = r.width;
    	
        int w = this.width;
        int h = this.height;
        if ((w | h | W | H) < 0) {
            // At least one of the dimensions is negative...
            return false;
        }
        int x = this.x;
        int y = this.y;
        if (X < x || Y < y) {
            return false;
        }
        w += x;
        W += X;
        if (W <= X) {
            // X+W overflowed or W was zero, return false if...
            // either original w or W was zero or
            // x+w did not overflow or
            // the overflowed x+w is smaller than the overflowed X+W
            if (w >= x || W > w) return false;
        } else {
            // X+W did not overflow and W was not zero, return false if...
            // original w was zero or
            // x+w did not overflow and x+w is smaller than X+W
            if (w >= x && W > w) return false;
        }
        h += y;
        H += Y;
        if (H <= Y) {
            if (h >= y || H > h) return false;
        } else {
            if (h >= y && H > h) return false;
        }
        return true;
    }
	
	
}
