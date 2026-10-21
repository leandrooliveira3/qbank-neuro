"""Analytic fixtures independent of patient data or source implementations."""
import unittest
import numpy as np
from audit_gs_ca import project,transform

class PhysicalProjection(unittest.TestCase):
    def test_known_divergent_beam_magnification(self):
        pixels,world=project(np.array([[10.,20.,-50.]]),np.eye(4),np.array([0.,0.,-100.]),np.array([.5,.5]))
        np.testing.assert_allclose(pixels,[[40.,80.]])
        np.testing.assert_allclose(world,[[20.,40.,0.]])
    def test_rigid_change_of_world_frame_keeps_detector_pixels(self):
        frame=np.array([[0.,-1.,0.,100.],[1.,0.,0.,200.],[0.,0.,1.,20.],[0.,0.,0.,1.]])
        points=transform(np.array([[10.,20.,-50.]]),frame)
        source=transform(np.array([[0.,0.,-100.]]),frame)[0]
        pixels,world=project(points,frame,source,np.array([.5,.5]))
        np.testing.assert_allclose(pixels,[[40.,80.]])
        np.testing.assert_allclose(world,[[60.,220.,20.]])
    def test_parallel_ray_is_rejected(self):
        with self.assertRaisesRegex(ValueError,'parallel'):
            project(np.array([[10.,0.,-100.]]),np.eye(4),np.array([0.,0.,-100.]),np.array([1.,1.]))

if __name__=='__main__':unittest.main()
