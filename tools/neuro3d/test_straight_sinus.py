import unittest
import numpy as np
from audit_straight_sinus import closest
class TriangleDistances(unittest.TestCase):
    def setUp(self):self.t=np.array([[[0.,0,0],[1,0,0],[0,1,0]]])
    def test_interior(self):
        d,q=closest(np.array([.2,.2,1]),self.t);self.assertAlmostEqual(d,1);np.testing.assert_allclose(q,[.2,.2,0])
    def test_edge(self):
        d,q=closest(np.array([1.,1,0]),self.t);self.assertAlmostEqual(d,np.sqrt(.5));np.testing.assert_allclose(q,[.5,.5,0])
    def test_degenerate_and_vertex(self):
        d,q=closest(np.array([-1.,0,0]),np.concatenate([self.t,np.zeros((1,3,3))]));self.assertAlmostEqual(d,1);np.testing.assert_allclose(q,[0,0,0])
if __name__=='__main__':unittest.main()
